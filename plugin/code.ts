declare const SITE_URL: string;

figma.showUI(`<script>window.location.href = '${SITE_URL}'</script>`, {
  width: 450,
  height: 700,
});

// Listen for node selection changes
figma.on("selectionchange", () => {
  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    const node = selection[0];
    figma.ui.postMessage({
      type: "SELECTED_NODE",
      node: {
        id: node.id,
        name: node.name,
        type: node.type,
      },
    });
  } else {
    figma.ui.postMessage({
      type: "SELECTED_NODE",
      node: null,
    });
  }
});

figma.ui.onmessage = async (message, props) => {
  if (props.origin !== SITE_URL) {
    return;
  }

  switch (message.type) {
    case "SELECT_NODE": {
      const node = figma.getNodeById(message.nodeId);
      if (node && node.type !== "DOCUMENT" && node.type !== "PAGE") {
        figma.currentPage.selection = [node as SceneNode];
      }
      break;
    }
    case "EVAL": {
      const fn = eval.call(null, message.code);

      try {
        const result = await fn(figma, message.params);
        figma.ui.postMessage({
          type: "EVAL_RESULT",
          result,
          id: message.id,
        });
      } catch (e) {
        figma.ui.postMessage({
          type: "EVAL_REJECT",
          error:
            typeof e === "string"
              ? e
              : e && typeof e === "object" && "message" in e
              ? e.message
              : null,
          id: message.id,
        });
      }

      break;
    }
  }
};
